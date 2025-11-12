import { MdImage } from "react-icons/md";
import { LuSendHorizontal } from "react-icons/lu";
import { IoClose } from "react-icons/io5";
import { chatStore } from "../store/chatStore";
import { useState } from "react";
import { useRef } from "react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const { sendMessage } = chatStore();
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size is too large. Please select an image smaller than 5MB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setImage(reader.result);
    };
    reader.onerror = () => {
      toast.error("Failed to read image file");
      e.target.value = "";
    };
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    // Don't send if there's no text and no image
    if (!text.trim() && !image) {
      return;
    }

    setIsUploading(true);
    try {
      await sendMessage({
        text: text.trim(),
        image: image,
      });

      setText("");
      setImage(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("failed to send message", error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="p-1 md:p-2 bg-base-200 w-full">
      {image && (
        <div className="relative mb-2 inline-block">
          <img
            src={image}
            alt="Preview"
            className="w-32 h-32 object-cover rounded-lg"
          />
          <button
            onClick={removeImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
          >
            <IoClose className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current.click()}
          className=" rounded-lg hover:bg-base-300 flex items-center justify-center"
          title="Attach image"
          disabled={isUploading}
        >
          <MdImage className="size-11 text-primary" />
        </button>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={handleImage}
        />
        <input
          type="text"
          placeholder="Type a message..."
          className="flex-1 p-2 rounded-lg md:rounded-xl focus:outline-none focus:ring-1 focus:ring-primary transition-colors text-gray-100 bg-slate-700 shadow-sm border border-base-300 text-sm md:text-base xl:w-[950px] sm:w-[520px]"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isUploading}
        />
        <button
          onClick={handleSendMessage}
          disabled={isUploading}
          className="p-2 md:p-3 bg-primary text-white rounded-lg md:rounded-xl hover:bg-primary-focus flex items-center justify-center shadow-xl bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <LuSendHorizontal className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
};

export default MessageInput;