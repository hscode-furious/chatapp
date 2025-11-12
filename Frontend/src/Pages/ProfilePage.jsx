import { FaCamera } from "react-icons/fa";
import { authStore } from "../store/authStore";
import { useState } from "react";

const ProfilePage = () => {
  const { loggedUser, updateProfile } = authStore();
  const [isUploading, setIsUploading] = useState(false);

  const handleProfileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size is too large. Please select an image smaller than 5MB.");
      e.target.value = "";
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        await updateProfile({ profilepic: reader.result });
      } catch (error) {
        console.error("Failed to update profile:", error);
      } finally {
        setIsUploading(false);
      }
    };
    reader.onerror = () => {
      console.error("Failed to read file");
      setIsUploading(false);
    };
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-gradient-to-r from-gray-500 to-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md relative overflow-hidden">
        <div className="absolute -top-8 -left-8 w-32 h-32 bg-blue-400 opacity-20 rounded-full z-0 animate-pulse"></div>
        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-pink-400 opacity-20 rounded-full z-0 animate-pulse"></div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative mb-6">
            <img
              src={loggedUser.profilepic}
              alt="Profile"
              className={`w-32 h-32 rounded-full border-4 border-blue-400 shadow-lg object-cover ${isUploading ? 'opacity-50' : ''}`}
            />
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            )}
            <label
              htmlFor="profile-upload"
              className={`absolute bottom-2 right-2 bg-gray-400 p-2 rounded-full shadow hover:bg-blue-100 transition cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
              title="Change Profile Picture"
            >
              <FaCamera className="text-blue-500 text-lg" />
              <input
                id="profile-upload"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleProfileUpload}
                disabled={isUploading}
              />
            </label>
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">
            {loggedUser.username}
          </h2>
          <p className="text-gray-200 mb-6">{loggedUser.email}</p>
        </div>
      </div>
    </div>
  );
};
export default ProfilePage;