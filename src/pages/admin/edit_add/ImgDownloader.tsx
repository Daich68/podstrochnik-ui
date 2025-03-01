import React, { useState } from 'react';
import {CdnGetUrl, CdnSaveUrl} from "../../../entity/constants/Urls";
import {CdnResponse} from "../../../entity/Entity";

type ImageUploaderProps = {
    checkSquare: boolean
}
const ImageUploader = ({checkSquare}: ImageUploaderProps) => {
    const [image, setImage] = useState<null| File>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [uploadStatus, setUploadStatus] = useState('Загрузите фото не более 1МB');
    const [url, setUrl] = useState('');


    const handleImageChange = (event: { target: HTMLInputElement }) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];

            // Check the file size
            if (file.size > 1048576) { // 1MB = 1 * 1024 * 1024 bytes
                setErrorMessage('Error: Image size exceeds 1MB');
                return;
            }

            // Validate if the image is a square
            const imageObject = new Image();
            imageObject.onload = () => {
                if (checkSquare && (imageObject.width !== imageObject.height)) {
                    setErrorMessage('Error: Image is not square');
                    return
                }

                setImage(file);
                setErrorMessage('');

            };
            imageObject.onerror = () => {
                setErrorMessage('Error: Invalid image file');
            };
            imageObject.src = URL.createObjectURL(file);
        }
    };

    const handleUpload = async (event: { preventDefault: () => void; }) => {
        event.preventDefault();
        if (!image) {
            setUploadStatus('Please select a file to upload.');
            return;
        }

        const formData = new FormData();
        formData.append('image', image);

        try {
            const response = await fetch(CdnSaveUrl, {
                method: 'POST',
                body: formData,
                // Note: When using FormData, the 'Content-Type' header should not be set explicitly
                // as the browser sets it to `multipart/form-data` with the proper `boundary`.
                // headers: { 'Content-Type': 'multipart/form-data' }, // Do not set this manually
            });

            if (response.ok) {
                const result: CdnResponse = await response.json();
                setUrl(`${CdnGetUrl}${result.uuid}`)
                setUploadStatus(`Upload successful url to copy`);
            } else {
                setUploadStatus('Upload failed: ' + response.statusText);
            }
        } catch (error) {
            // @ts-ignore
            setUploadStatus('Upload error: ' + error.message);
        }
    };
    const handleCopy = async () => {
        try {
            // Use the navigator.clipboard API to copy text
            await navigator.clipboard.writeText(url);
        } catch (err) {
            console.error(err)
        }
    };

    return (
        <div>
            <img src={url} style={{width: "100px", height: "100px"}} alt={""}/>
            <form onSubmit={handleUpload}>
                <input type="file" accept="image/*" onChange={handleImageChange} />
                <button type="submit">Upload Image</button>
            </form>
            {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
            <p>{uploadStatus}</p>
            {url && <>
                <button onClick={handleCopy}>Copy Url</button> {/* Button to trigger copying */}
                    </>
            }

        </div>
    );
};

export default ImageUploader;
