import uuid
#  genrate unique name 
from io import BytesIO
#  work image byte in memeory 
# REMOVED At time of AWS  from pathlib import Path
# files operation 
from PIL import Image, ImageOps 
# main image fun, conviance image operation
import boto3
from starlette.concurrency import run_in_threadpool
from config import settings

# PROFILE_PICS_DIR = Path("media/profile_pics")
# Path(): lib gives very nice way to work with files instaned of file mauoluaiton 

## _get_s3_client private helper for image_utils.py
# ment to use internally not imported and called to use in other place 
# this gives acess to s3 client using those creditinals 
def _get_s3_client():
    return boto3.client(
        "s3",
        region_name=settings.s3_region,
        aws_access_key_id=(
            settings.s3_access_key_id.get_secret_value()
            if settings.s3_access_key_id
            else None
        ),
        aws_secret_access_key=(
            settings.s3_secret_access_key.get_secret_value()
            if settings.s3_secret_access_key
            else None
        ),
        endpoint_url=settings.s3_endpoint_url,
    )       


# pillow sync operation if used this in the direct fastapi main it wil block event loop
#  solutuion use the run in thread pool


def process_profile_image(content: bytes) -> tuple[bytes, str]:
    with Image.open(BytesIO(content)) as original:
        img = ImageOps.exif_transpose(original)
        #  fix orientation issue 

        img = ImageOps.fit(img, (300, 300), method=Image.Resampling.LANCZOS)
        #  gives high qulity resampling 

        if img.mode in ("RGBA", "LA", "P"):
            img = img.convert("RGB")

        filename = f"{uuid.uuid4().hex}.jpg"
        #  ignore user file name 
        # important for the security
        # filepath = PROFILE_PICS_DIR / filename
        output= BytesIO()

        # PROFILE_PICS_DIR.mkdir(parents=True, exist_ok=True)

        img.save(output, "JPEG", quality=85, optimize=True)
        output.seek(0)

    return output.read(),filename

#  used: update new picture 
#  delete account 
# def delete_profile_image(filename: str | None) -> None:
#     if filename is None:
#         return

#     filepath = PROFILE_PICS_DIR / filename
#     if filepath.exists():
#         filepath.unlink()



def _upload_to_s3(file_bytes: bytes, key: str) -> None:
    s3 = _get_s3_client()
    s3.upload_fileobj(
        BytesIO(file_bytes),
        settings.s3_bucket_name,
        key,
        ExtraArgs={"ContentType": "image/jpeg"},
        # not direclty download behavies in way that you expacts
    )


def _delete_from_s3(key: str) -> None:
    s3 = _get_s3_client()
    s3.delete_object(Bucket=settings.s3_bucket_name, Key=key)



async def upload_profile_image(file_bytes: bytes, filename: str) -> None:
    key = f"profile_pics/{filename}"
    await run_in_threadpool(_upload_to_s3, file_bytes, key)


async def delete_profile_image(filename: str | None) -> None:
    if filename is None:
        return
    key = f"profile_pics/{filename}"
    await run_in_threadpool(_delete_from_s3, key)