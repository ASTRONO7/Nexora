const API_KEY = import.meta.env.VITE_BYTESCALE_API_KEY || '';

// ByteScale Public API Key format: public_ACCOUNT_ID_UNRESTRICTED_KEY
// We need to extract the Account ID from the public key
const getAccountId = (apiKey: string) => {
    if (!apiKey) return '';
    const parts = apiKey.split('_');
    return parts[1] || '';
};

const ACCOUNT_ID = getAccountId(API_KEY);
const UPLOAD_URL = ACCOUNT_ID ? `https://api.bytescale.com/v2/accounts/${ACCOUNT_ID}/uploads/binary` : '';

export interface UploadResult {
    fileUrl: string;
    fileId: string;
    size: number;
    mime: string;
}

export const uploadFile = async (file: File): Promise<UploadResult> => {
    try {
        const response = await fetch(UPLOAD_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': file.type,
            },
            body: file,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData?.error?.message || `Upload failed: ${response.statusText}`);
        }

        const data = await response.json();

        // ByteScale returns fileUrl, fileId, etc.
        return {
            fileUrl: data.fileUrl,
            fileId: data.fileId,
            size: data.size,
            mime: data.mime,
        };
    } catch (error: any) {
        console.error('ByteScale Upload Error:', error);
        throw new Error(error.message || 'File upload failed');
    }
};
