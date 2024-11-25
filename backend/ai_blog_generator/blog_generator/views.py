from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import  api_view, authentication_classes, permission_classes
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response 
from rest_framework.authtoken.models import Token
from .serializer import UserSerializer, BlogPostSerializer
from .models import BlogPost
from pytube import YouTube
from ai_blog_generator import settings
import os
import jwt
import time
import assemblyai as aai
from yt_dlp import YoutubeDL
from blog_generator.AI_Model import chat_session
from dotenv import load_dotenv


load_dotenv()



# Authentication Routes

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def signup(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        user = User.objects.get(username=request.data["username"])
        user.set_password(request.data['password'])
        user.save()
        token = Token.objects.create(user=user)
        
        return Response({
            'message': 'User signin successful',
            'token': token.key,
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def is_token_expired(token):
    try:
        decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])

        if decoded_token.get("exp", 0) < int(time.time()):
            return True
        return False
    except jwt.ExpiredSignatureError:
        return True
    except jwt.DecodeError:
        return True

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def login(request):
    print("\n")
    print(request.data["username"], request.data["password"])
    print("\n")
    user = get_object_or_404(User, username=request.data['username'])
    if user:
        if not user.check_password(request.data['password']):
            return Response({'message': 'Username or password is wrong'},  status=status.HTTP_403_FORBIDDEN)
        existing_token = Token.objects.filter(user=user).first()
        token_expired = is_token_expired(existing_token)
        if token_expired:
            existing_token.delete()
            token = Token.objects.create(user=user)
        else:
            token = existing_token
        # serializer = UserSerializer(instance=user)
        return Response({"message": "User logged in successfully", "token": token.key})
    return Response({'message': 'Username or password is wrong'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(["GET"])
@authentication_classes([SessionAuthentication, TokenAuthentication])
@permission_classes([IsAuthenticated])
def blog_list(request):
    blog_articles = BlogPost.objects.filter(user=request.user)
    serializer = BlogPostSerializer(blog_articles, many=True)
    return Response({'blogs': serializer.data})


@api_view(["GET"])
@authentication_classes([SessionAuthentication, TokenAuthentication])
@permission_classes([IsAuthenticated])
def blog_detail(request, pk):
    blog_article_detail = BlogPost.objects.get(id=pk)
    serializer = BlogPostSerializer(blog_article_detail)
    if request.user == blog_article_detail.user:
        return Response({'blog': serializer.data})
    
    


@csrf_exempt
@api_view(['POST'])
@authentication_classes([SessionAuthentication, TokenAuthentication])
@permission_classes([IsAuthenticated])
def generate_blog(request):
    if request.method == "POST":
        try:
            yt_link = request.data['link']
            
        except Exception as e:
            return Response({'message': "Invalid Data Sent"}, status=status.HTTP_400_BAD_REQUEST)

        # Get the youtube video title
        title, description = yt_title(yt_link)

        # Get transcript of the youtube video
        transcript = get_transcription(yt_link)

        # Generate content from Gemini API
        prompt = f'''You are given the title, description and transcript of a youtube video. Make a detailed blog describing each points in the transcription. Refer the title and description to know more details about the video and use the transcription to make an extensive blog having different sections describing each points in the transcription with details. Don't make it feel like an youtube video but make it as it is a well described blog. In the end return only the HTML code and proper HTML code only having all the content which upon rendering shows a well designed article file in outout. Make sure the indentation, formatting are right so that the HTML code upon rendering shows a proper blog article and it can also be converted into a pdf file. title: "{title}", description= "{description}", transcript: "{transcript}" HTML Response: '''

        response = generate_blog_from_gemini_ai(prompt)


        # Saveblog articles to database
        new_blog_article = BlogPost.objects.create(
            user = request.user,
            youtube_link = yt_link,
            youtube_title = title,
            youtube_description = description,
            generated_content = response
        )

        new_blog_article.save()

        # Return blog articles as response


        if transcript:
            return Response({"generated_content": response, "title": title,"description": description, "transcript": transcript})
        else:
            return Response({'message': 'Failed to get the transcript'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    return Response({"message": "Error in fetching title"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    

def yt_title(link):
    try:
        # options to fetch video metadata
        ydl_opts = {'quiet': True, 'no_warnings': True, 'extract_flat': True}
        
        # extract information using YouTubeDLP
        with YoutubeDL(ydl_opts) as ydl:
            info_dict = ydl.extract_info(link, download=False)
            # Extract the title & description
            title = info_dict.get('title', None)
            description = info_dict.get('description', None)
            return {title, description}
    except Exception as e:
        return(e)


def download_audio(link):
    yt = YouTube(link)

    options = {
        'format': 'bestaudio/best',  # Download best available audio
        'outtmpl': f'{settings.MEDIA_ROOT}/%(title)s.%(ext)s',  # Save with title as filename
        'postprocessors': [
            {  # Convert to mp3 if needed
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }
        ],
    }

    with YoutubeDL(options) as ydl:
        info = ydl.extract_info(link, download=True)
        filename = ydl.prepare_filename(info).replace('.webm', '.mp3')  # Ensure proper extension
        return filename

    # video = yt.streams.filter(only_audio=True).first()
    # out_file = video.download(output_path = settings.MEDIA_ROOT)
    # base, ext = os.path.split(out_file)
    # new_file = base + ".mp3"
    # os.rename(out_file, new_file)
    # return new_file

def get_transcription(link):
    try:
        audio_file = download_audio(link)
        aai.settings.api_key = os.getenv("ASSEMBLYAI_API_KEY")

        transcriber = aai.Transcriber()
        transcript = transcriber.transcribe(audio_file)

        return transcript.text
    except Exception as e:
        return e

def generate_blog_from_gemini_ai(data):
    try:
        response = chat_session.send_message(data)
        return response.text
    except Exception as e:
        return e

