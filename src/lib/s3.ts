import AWS from 'aws-sdk';

export async function uploadToS3(file: File){
    try{
        AWS.config.update({
            accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
        })

        const file_key = 'uploads/' + Date.now().toString() + file.name.replaceAll(' ', '-');

        const s3 = new AWS.S3({
            params: {
                Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
                Key: file_key,
            },
            region: 'us-east-1',
        })

        const params = {
            Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
            Key: file_key,
            Body: file,
        }

        

        const upload = s3.putObject(params).on('httpUploadProgress', event => {
            console.log("Upload Progress...", parseInt(((event.loaded * 100) / event.total).toString()))
        }).promise();

        await upload.then(data => {
            console.log("Upload Successful...", data.ETag)
        })

        return Promise.resolve({
            file_key,
            file_name: file.name,
        })
        
    } catch (error){
        console.error("Error uploading to S3...", error)
        return Promise.reject(error)
    }
}

export function getS3Url(file_key: string){
    const url = `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.us-east-1.amazonaws.com/${file_key}`;
    return url;
}