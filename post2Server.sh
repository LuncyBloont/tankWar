server=127.0.0.1
user=ubuntu
if [ $1 ]; then
    server=$1
fi
if [ $2 ]; then
    user=$2
fi
echo "web content will be sent to ${user}@${server}:~/webs"

cd $(dirname $0)

if [ -d tmp ]; then
    rm -r tmp
fi
mkdir tmp
mkdir tmp/js
mkdir tmp/server
cp -r ./config tmp/
cp -r ./css tmp/
cp -r ./otherTex tmp/
cp -r ./js/*.js tmp/js/
cp -r ./models tmp/
cp -r ./server/*.js tmp/server/
cp -r ./shaders tmp/
cp -r ./*.js tmp/
cp -r ./*.html tmp/
cp -r ./*.png tmp/
cp -r ./*.ico tmp/
cp -r ./run.sh tmp/

scp -r ./tmp ${user}@${server}:~/webs/tank
rm -r tmp
echo Done.
exit