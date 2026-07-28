# encryption can be indecyptio
# but argon2 hash will everytime differnt hash genrate 

from datetime import UTC, datetime, timedelta

import jwt
from fastapi.security import OAuth2PasswordBearer
from pwdlib import PasswordHash

from config import settings


# setup password hasher: create password hash with aegon2 with recommed settings piwlib[argon2]
password_hash = PasswordHash.recommended()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/users/token")
# So this token URL has to match our login endpoint path which will be for/ API/
# users/token. So this ooth 2 password bearer extracts
# the token from the authorization header. So when a client sends that, this schema
# extracts that token for us. And a nice s side effect of this is that this enables
# the authorize button in our docs which makes testing authentication a lot
# easier. 


# password hashing function
# take plain text password -> return hash
def hash_password(password: str) -> str:
    return password_hash.hash(password)

# verify 
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_hash.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(
            minutes=settings.access_token_expire_minutes,
        )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.secret_key.get_secret_value(),
        algorithm=settings.algorithm,
    )
    return encoded_jwt

#  take token str and return USerID if token is vaild 
# store user ID in sub field when we create the TOKEN
def verify_access_token(token: str) -> str | None:
    """Verify a JWT access token and return the subject (user id) if valid."""
    try:
        payload = jwt.decode(
            token,
            settings.secret_key.get_secret_value(),
            algorithms=[settings.algorithm],
            options={"require": ["exp", "sub"]},
        )
    except jwt.InvalidTokenError:
        return None
    else:
        return payload.get("sub")





# JWT STRECTUE 
# Header: contains the algorithm and type, a 
# payload: which contains our data plus the expiration 
# signature: which proves the token wasn't tampered with. 

# And all three parts are B 64 encoded and separated by dots. The
# signature is created using our secret key. So only our server can create valid token 