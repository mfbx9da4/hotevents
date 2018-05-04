
## First time

    source ~/.virtualenvs/python3env/bin/activate
    pip install awscli

## Update

    source ~/.virtualenvs/python3env/bin/activate
    # cd to root dir
    zip -r tmp/lambda.zip .
    aws lambda update-function-code --function-name hellowrld --zip-file "fileb://tmp/lambda.zip"
