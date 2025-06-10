// Frontend/src/components/MessageInput.jsx
import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X } from "lucide-react";
import toast from "react-hot-toast";

// Accept chatId and messageType as props
const MessageInput = ({ chatId, messageType }) => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  // The existing sendMessage in useChatStore will be replaced or overloaded
  // For now, let's assume it's updated to handle this.
  const { sendMessage } = useChatStore();
  const [isSending, setIsSending] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    if (!chatId || !messageType) {
      toast.error("Chat context is not properly set.");
      return;
    }

    setIsSending(true);
    try {
      // Call the generic sendMessage with all necessary data
      await sendMessage({ // This now refers to the new generic sendMessage
        chatId,
        messageType,
        text: text.trim(),
        image: imagePreview,
      });

      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      // Error is already toasted by useChatStore's sendMessage
      console.error("Failed to send message from component:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-4 w-full border-t border-base-300"> {/* Added border */}
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-base-300" // Use base-300 for border
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-error text-error-content
              flex items-center justify-center" // Changed to error theme for delete
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isSending}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
            disabled={isSending}
          />

          <button
            type="button"
            className={`hidden sm:flex btn btn-circle btn-sm sm:btn-md
                            ${imagePreview ? "text-primary" : "text-zinc-400"}`} // Use primary color if image
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
          >
            <Image size={20} />
          </button>
        </div>
        <button
          type="submit"
          className="btn btn-sm sm:btn-md btn-circle btn-primary" // Use primary color
          disabled={!text.trim() && !imagePreview || isSending}
        >
          {isSending ? <span className="loading loading-spinner loading-xs"></span> : <Send size={22} />}
        </button>
      </form>
    </div>
  );
};
export default MessageInput;