if [ ! -d "./runable" ]; then
    mkdir ./runable
    mkdir ./runable/js
    mkdir ./runable/server
fi

cp -r ./config ./runable
cp -r ./css ./runable
cp -r ./audio ./runable
cp -r ./nodejs-lit ./runable
cp -r ./otherTex ./runable
cp -r ./js/*.js ./runable/js
cp -r ./models ./runable
cp -r ./server/*.js ./runable/server
cp -r ./shaders ./runable
cp -r ./*.js ./runable
cp -r ./*.html ./runable
cp -r ./*.png ./runable
cp -r ./*.ico ./runable
cp -r ./run.bat ./runable

7z a runable1.0.4.zip ./runable 
rm ./runable -d -r
