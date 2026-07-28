from __future__ import annotations
from datetime import UTC, datetime
from sqlalchemy import DateTime, ForeignKey, String, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base

# ========================================================
# NOTE ON FORWARD REFERENCES:
# The `from __future__ import annotations` import at the top is the magic trick 
# that allows the `User` class to reference the `Post` class before Python has 
# actually evaluated the `Post` code block lower down in the file.
# ========================================================

class User(Base):
    """
        Represents the database structure for application Users.
        Handles user profiles, images, and maps relationships to their posts.
    """
    __tablename__="users"
    id: Mapped[int]= mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str]= mapped_column(String(50), unique= True, nullable= False)
    email: Mapped[str]= mapped_column(String(120), unique= True, nullable= False)

    # Decoupling Data: Saving just the filename string in the database means if we move our 
    # folder structure from local storage to an AWS S3 cloud bucket later, the database stays untouched!
    image_file: Mapped[str| None]= mapped_column(
        String(120), nullable=True, default=None
    )

    # need to add th passwored hased
    password_hash: Mapped[str]= mapped_column(String(200), nullable=False)

    
    # One-to-Many Relationship: One user can have many posts.
    # 'back_populates' syncs this property with the corresponding 'author' field in the Post model.
    posts: Mapped[list[Post]]= relationship(back_populates="author", cascade="all, delete-orphan")
   # one user have many post 
   # back_populate: that link author field on post 
   # cascade: if user deleted delete all of there post also 
   # allow us to do somthing like users.posts to grab all user post
   # refernce Post Before it is define it is callled as the forword referance and alavliabke in python 3.14
        # ┌──────────────┐                       ┌──────────────┐
        # │  USER MODEL  │                       │  POST MODEL  │
        # ├──────────────┤                       ├──────────────┤
        # │  id (1)      │                       │  id (99)     │
        # │  username    │                       │  title       │
        # │              │                       │  user_id (1) ┼──┐
        # │  posts  ─────┼───( back_populates )──┼─►author      │  │ (Foreign Key Enforces
        # └──────▲───────┘                       └──────────────┘  │  Data Integrity Match)
        #        │                                                 │
        #        └─────────────────────────────────────────────────┘
    @property
    def  image_path(self)-> str:
        """
        A helper property that computes the visual layout file path dynamically.
        Separates data storage logic from user presentation layer logic.
        """
        if self.image_file:
            return f"/media/profile_pics/{self.image_file}"
        return "/static/profile_pics/default.jpg" 

class Post(Base):
    """
        Represents the database structure for Blog Posts.
    """
    __tablename__="posts"
    id: Mapped[int]=mapped_column(Integer, primary_key=True,index=True)
    title: Mapped[str]=mapped_column(String(50), nullable=False)
    content: Mapped[str]=mapped_column(Text, nullable=False)
    user_id: Mapped[int]=mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    # ForeignKey: that link post to user this must refarnace to valide user
    # Setting an index here acts like a book index: it makes filtering queries (like tracking
        # down posts written by user #5) significantly faster, 
        # with a minor trade-off of slightly slower writes.

    # Timezones: Using 'timezone=True' ensures that dates remain consistent if we scale
    # our servers or move away from SQLite to PostgreSQL down the road.
    date_posted: Mapped[datetime] = mapped_column(
            DateTime(timezone=True), 
            default=lambda: datetime.now(UTC)
        )

    # Many-to-One Relationship: Many posts belong to one individual user author.
    # Allows us to run `post.author` to instantly get the 
    # parent User object without writing complex JOIN queries. sqlalchemy handle that for us
    author: Mapped[User] = relationship(back_populates="posts")
        