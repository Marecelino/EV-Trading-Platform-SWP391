// src/utils/cloudinary.ts
export const uploadToCloudinary = async (file: File): Promise<string> => {
  const cloudName = "dfibid2nb"; 
  const uploadPreset = "swp392"; 

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Upload to Cloudinary failed");
  }

  const data = await response.json();
  return data.secure_url; 
};
