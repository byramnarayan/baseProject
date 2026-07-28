from typing import Annotated
from datetime import timedelta
# timedelta; for token expriation

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func,select
# func: casesentive user query 
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

import models
from database import get_db
from schemas import PostResponse, UserCreate, UserPrivate, UserPublic, Token, UserUpdate

from fastapi.security import OAuth2PasswordRequestForm


from auth import (
    create_access_token,
    hash_password,
    oauth2_scheme,
    verify_access_token,
    verify_password,
)

from config import settings

router = APIRouter()


@router.post(
    "",
    response_model=UserPrivate,
    # that specfic user will get user info after user is created 
    status_code=status.HTTP_201_CREATED,
)
async def create_user(user: UserCreate, db: Annotated[AsyncSession, Depends(get_db)]):
    # db:Annotated is dependecy injection this it call hey before createing this function call get_db and pass result as d parameter
    result = await db.execute(
            select(models.User).where(
            func.lower(models.User.username) == user.username.lower()
        ))
        # "RamM"="Ram" check 
        # there user.username is from function parameter 

    # check user name alrady exists 
    existing_user = result.scalars().first()
    # get first user object or None 
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")

    result = await db.execute(
            select(models.User).where(func.lower(models.User.email) == user.email.lower()),
        )
    existing_email = result.scalars().first()
    if existing_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists")

# need to update how to ceate the user in auth system 
    new_user= models.User(
        username=user.username,# frontend will be shown "RamM"
        email=user.email.lower(),  # email will be lowercased
        password_hash=hash_password(user.password)
    )

    db.add(new_user)
    # stage insert
    await db.commit()
    # saves to databse
    await db.refresh(new_user)
    #  reload to the database
    # commit, refresh: have actual database operation of IO
    return new_user


# LOGIN
@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    #OAuth2PasswordRequestForm: as depency help in parsing login form data
    db: Annotated[AsyncSession, Depends(get_db)],
):
    # Look up user by email (case-insensitive)
    # Note: OAuth2PasswordRequestForm uses "username" field, but we treat it as email
    # look up userby email 
    result = await db.execute(
        select(models.User).where(
            func.lower(models.User.email) == form_data.username.lower(),
        ),
    )
    user = result.scalars().first()

    # Verify user exists and password is correct
    # Don't reveal which one failed (security best practice)
    #  user does not exit and password is wrong 
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
#  eveyrting check out 
    # Create access token with user id as subject
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires,
    )
    return Token(access_token=access_token, token_type="bearer")

# "/me": so frontend get he current user 
@router.get("/me", response_model=UserPrivate)
async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    #  oauth2_scheme : extract the token from authrization header
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """verfiy user and get Get the currently authenticated user."""
    user_id = verify_access_token(token)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Validate user_id is a valid integer (defense against malformed JWT)
    try:
        user_id_int = int(user_id)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    result = await db.execute(
        select(models.User).where(models.User.id == user_id_int),
    )
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user





@router.get("/{user_id}", response_model=UserPublic)
async def get_user(user_id: int, db: Annotated[AsyncSession, Depends(get_db)]):
    result = await db.execute(select(models.User).where(models.User.id == user_id))
    user=result.scalars().first()

    if user:
        return user
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found pls check again ")



@router.get("/{user_id}/posts", response_model=list[PostResponse])
async def get_user_posts(user_id: int, db: Annotated[AsyncSession, Depends(get_db)]):
    result = await db.execute(select(models.User).where(models.User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    result = await db.execute(
        select(models.Post)
        .options(selectinload(models.Post.author))
        .where(models.Post.user_id == user_id)
        .order_by(models.Post.date_posted.desc())
    )
    posts = result.scalars().all()
    return posts


## update_user
@router.patch("/{user_id}", response_model=UserPrivate)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    #  validate the model people are trying to update the model in database 
    db: Annotated[AsyncSession, Depends(get_db)],
    ):
    result = await db.execute(select(models.User).where(models.User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
        # checkusername if exit return 400 ERROR
    if user_update.username is not None and user_update.username.lower() != user.username.lower():
        result = await db.execute(
                    select(models.User).where(
                    func.lower(models.User.username) == user_update.username.lower(),
            ),
               )
        existing_user = result.scalars().first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists",
            )

    if user_update.email is not None and user_update.email.lower() != user.email.lower():
        result = await db.execute(
                    select(models.User).where(
                    func.lower(models.User.email) == user_update.email.lower(),
                ))
        existing_email = result.scalars().first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

    if user_update.username is not None:
        user.username = user_update.username
    if user_update.email is not None:
        user.email = user_update.email.lower()
    if user_update.image_file is not None:
        user.image_file = user_update.image_file

    await db.commit()
    await db.refresh(user)
    return user

## delete_user
@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: int, db: Annotated[AsyncSession, Depends(get_db)]):
    result = await db.execute(select(models.User).where(models.User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    await db.delete(user)
    #  notice required the IO bound session 
    # not required in .add session 
    await db.commit()