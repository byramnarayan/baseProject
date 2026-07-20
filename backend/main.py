from contextlib import asynccontextmanager
# asynccontextmanager: for life span function
from typing import Annotated
from fastapi import FastAPI,Request,HTTPException,Depends,status
# Request: used for jinja2 template
# HTTPException: used for to return proper http responses
# status: gives use constant for HTTPException which make code more readable
from fastapi.exception_handlers import (
    http_exception_handler,
    request_validation_exception_handler,
)
from fastapi.exceptions import RequestValidationError
# RequestValidationError: validation error from exception handler like /hello in place of /34
from fastapi.responses import JSONResponse
# JSONResponse: mainly return JSON Resposes
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
# selectinload: eager loading relationship which is super imporant 
# inso the solution is eager

# loading with select and load that we imported earlier. So instead of letting

# SQL Alchemy lazy load relationships when you access them, you explicitly tell SQL

# Alchemy to load them immediately with the main query. And we'll see how to do

# that in just a second.
# query wehere need realtionshio used eager loading 



import models
from database import Base, engine, get_db
from routers import posts,users




# Base.metadata.create_all(bind=engine)
# lifespan: morden FastAPi way t handle startup and shutdown event 
@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Startup
    async with engine.begin() as conn:
        # engine.begin: get async connection
        await conn.run_sync(Base.metadata.create_all)
        # run_sync: let us run sync create call method inside async context
    yield # there application acutally runs 
    # Shutdown
    await engine.dispose()
#  in end it do async way to to creating database if it do not exit 
app = FastAPI(lifespan=lifespan)
# ==============================================================================
# 🚨 CRITICAL STUDY NOTE: SYNC VS. ASYNC RELATIONSHIP LOADING (THE #1 ASYNC PITFALL)
# ==============================================================================
#
# 1. THE SYNCHRONOUS WAY: "LAZY LOADING"
#    In Sync SQLAlchemy, when you fetch a Post, its related Author isn't fetched yet.
#    The moment your code (or HTML template) accesses `post.author.username`, SQLAlchemy
#    silently triggers a hidden, synchronous database query in the background to grab 
#    the user information. It "just works" because blocking the thread is allowed.
#
# 2. THE ASYNC CRISIS: "MISSING GREENLET ERROR"
#    In Async SQLAlchemy, implicit lazy loading is strictly banned. 
#    If you try to run `post.author.username` without preparing it beforehand, your app
#    will crash instantly with:
#    ❌ `sqlalchemy.exc.MissingGreenlet: Field 'author' is not loaded...`
#
#    WHY? Because accessing a Python property (`post.author`) cannot be prefixed with
#    the `await` keyword. SQLAlchemy cannot pause the entire global async event loop 
#    to make a hidden, blocking network call, so it throws a safety error instead.
#
# 3. THE PRODUCTION FIX: "EAGER LOADING" WITH `selectinload`
#    To prevent this, you must explicitly tell SQLAlchemy to fetch the related data 
#    IMMEDIATELY during the main, awaited query. This is called Eager Loading.
# 
# 
# 
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/media", StaticFiles(directory="media"), name="media")

templates = Jinja2Templates(directory="templates")

app.include_router(users.router, prefix="/api/users", tags=["users"])
# tags: create collapsable sections
# Prefix add that traling slash
#
app.include_router(posts.router, prefix="/api/posts", tags=["posts"])




@app.get("/", include_in_schema=False, name="home")
# given name="home" so {{ url_for('home') }} use explict name when apply two const.
async def home(request: Request, db: Annotated[AsyncSession, Depends(get_db)]):# request parameter as argument because Jinja2 required that
    result = await db.execute(select(models.Post).options(selectinload(models.Post.author)))
    # options: this is eager loading
    posts = result.scalars().all()

    # by doing this we get our post from database
    return templates.TemplateResponse(
        request, # need jinja2 to work
        "home.html",#name of template file
        {"posts": posts, "title": "Home"},
        # context dict: contain all of variable that will be use in frontend
        # template can acess anything that is in that context
        # jinja3 let us acess dict key as dot notation, which is clean way to do in our template
        # IF STATEMENT{% for post in posts%}
        #             {% endfor %}
        # CONDITION STATMENT {% if title%}
        #                    {% else %}
        #                    {% endif %}
        # BLOCK CONTENT ->layout.html
        #{% block content %}
        #{% endblock content %}
        # home.html
        # {% extends layout.html%}
        # {% block content %}
        # code
        # {% endblock content%}
        # ********
        # Route Links:
            # passing **** def home(): function name
            # To generate links to specific pages in your navigation (e.g., {{ url_for('home') }})
        # Static Files:
            # To link to CSS, JavaScript, or images.
            # You reference the name you gave your static directory during mounting
            # (e.g., {{ url_for('static', path='css/main.css') }})
            # 
            # 
            # 
        #  need to change the template after adding the database for new relationship data 
        # home.html, post.html need to chnage how we display date and author
        # becaus author is now object
        # so  post.author  become  post.author.username 
        # date is datetime object 
    )

@app.get("/posts/{post_id}", include_in_schema=False)
async def post_page(request: Request, post_id: int, db: Annotated[AsyncSession, Depends(get_db)]):
    result =await db.execute(select(models.Post).options(selectinload(models.Post.author)).where(models.Post.id == post_id))
    post = result.scalars().first()
    if post:
        title = post.title[:50]
        return templates.TemplateResponse(
            request,
            "post.html",
            {"post": post, "title": title},
        )
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
        #  ALLWAYS USE THIS in  html respone this is raise error to RestAPI
#  href="{{ url_for("post_page", post_id=post.id)}}: pass path parameter as keyword argument post_id=post.id


# template version to see specific user all post 
@app.get("/users/{user_id}/posts", include_in_schema=False, name="user_posts")
async def user_posts_page(
    request: Request,
    user_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(models.User).where(models.User.id == user_id))
    # it does not need becuse we are not acessing any relation in objects 
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    result = await db.execute(select(models.Post).options(selectinload(models.Post.author)).where(models.Post.user_id == user_id))
    posts = result.scalars().all()
    return templates.TemplateResponse(
        request,
        "user_posts.html",
        {"posts": posts, "user": user, "title": f"{user.username}'s Posts"},
    )

















@app.exception_handler(StarletteHTTPException)
async def general_http_exception_handler(request: Request, exception: StarletteHTTPException):
    
    if request.url.path.startswith("/api"):
        return await http_exception_handler(request, exception)
    message = (
            exception.detail
            if exception.detail
            else "An error occurred. Please check your request and try again."
        )

    return templates.TemplateResponse(
        request,
        "error.html",
        {
            "status_code": exception.status_code,
            "title": exception.status_code,
            "message": message,
        },
        status_code=exception.status_code,
    )
    # to get the correct respone for RESTAPI

# handle validation error/posts/hello kind of thing
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exception: RequestValidationError):
    if request.url.path.startswith("/api"):
        return await request_validation_exception_handler(request, exception)

    return templates.TemplateResponse(
        request,
        "error.html",
        {
            "status_code": status.HTTP_422_UNPROCESSABLE_CONTENT,
            "title": status.HTTP_422_UNPROCESSABLE_CONTENT,
            "message": "Invalid request. Please check your input and try again.",
        },
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
    )
