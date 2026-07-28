from typing import Annotated

from fastapi import APIRouter, HTTPException, status,Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

import models
from database import get_db,Base, engine 
from schemas import PostCreate, PostResponse,PostUpdate
#  basiclyy pydantic define out data conaratc define what data comes in what data goes out
#  use this for data validation, serilization and documentation for example
router = APIRouter()




@router.get("", response_model=list[PostResponse])
async def get_posts(db: Annotated[AsyncSession, Depends(get_db)]):
    result = await db.execute(
        select(models.Post).options(selectinload(models.Post.author))
        .order_by(models.Post.date_posted.desc()),
    )
    #  selectinload is the lazy laoding where data are alrdey loaded before the that function is callled 
    posts = result.scalars().all()
    return posts
#  pydentic will automatically serilized author relation as user response 


@router.post(
    "",
    response_model=PostResponse,
    status_code=status.HTTP_201_CREATED,
    # Restfull best pratice when our post is created i.e. new resource are sucesfull created
)
async def create_post(post: PostCreate, db: Annotated[AsyncSession, Depends(get_db)]):
    result = await db.execute(
        select(models.User).where(models.User.id == post.user_id),
    )
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    new_post = models.Post(
        title=post.title,
        content=post.content,
        user_id=post.user_id,
    )
    db.add(new_post)
    await db.commit()
    await db.refresh(new_post,  attribute_names=["author"])
    #  attribute_names=["author"]: that's pretty important. So when we create a new post and then return it, we need the author
    # to be loaded for the post response. So instead of doing a separate query with
    # select and load, we can tell refresh to also load specific relationships using
    # the attribute name parameter. So await db.refresh uh using this here will
    # refresh the post and load the author relationship. And the other place that
    # we did this was in update post full
    return new_post


# path parameter
@router.get("/{post_id}", response_model=PostResponse)
#use post_id: to capture path parameter
# and pass post_id: as parameter to function
async def get_post(post_id: int, db: Annotated[AsyncSession, Depends(get_db)]):
    result = await db.execute(
        select(models.Post)
        .options(selectinload(models.Post.author))
        .where(models.Post.id == post_id),
    )
    post = result.scalars().first()
    if post:
        return post
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    # status, detial have used to make the find error easliy and make error readable
    # ▕  127.0.0.1:62719 - "GET /api/posts/jh HTTP/1.1" 422
    # ▕  127.0.0.1:62720 - "GET /api/posts/55 HTTP/1.1" 404
    # 

# UPDATE POST
# Put: FOR FULL update
@router.put("/{post_id}", response_model=PostResponse)
async def update_post_full(
    post_id: int,
    post_data: PostCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(models.Post).where(models.Post.id == post_id))
    post = result.scalars().first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
        # check user exists 
    if post_data.user_id != post.user_id:
        result = await db.execute(
                   select(models.User).where(models.User.id == post_data.user_id),
               )
        user = result.scalars().first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )       
    post.title=post_data.title
    post.content=post_data.content
    post.user_id=post_data.user_id


    await db.commit()
    await db.refresh(post, attribute_names=["author"])
    return post





# PATC: FOR Partial update
@router.patch("/{post_id}", response_model=PostResponse)
async def update_post_partial(
    post_id: int,
    post_data: PostUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(models.Post).where(models.Post.id == post_id))
    post = result.scalars().first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
        # check user exists 
    update_data=post_data.model_dump(exclude_unset=True) # this will give dictonary 
#  IF with out exclude_unset if person do title update pydentic will send all other data alogn with that 
# with exclude_unset true we only send what klient want to udate 
    for field, value in update_data.items():
        setattr(post,field,value)


    await db.commit()
    await db.refresh(post, attribute_names=["author"])
    return post




# DELETE POST
@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(post_id: int, db: Annotated[AsyncSession, Depends(get_db)]):
    result = await db.execute(select(models.Post).where(models.Post.id == post_id))
    post = result.scalars().first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
        # check user exists 



        
    await db.delete(post)
    await db.commit()
