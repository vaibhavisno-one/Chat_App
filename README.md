# Wave - Realtime Chat Application

Wave is a modern and responsive real-time chat application that allows users to connect, communicate, and collaborate seamlessly. Built with a robust tech stack, Wave ensures fast and reliable communication for all users.

## Features

- **Realtime Messaging**: Instant communication powered by WebSocket technology.
- **User Authentication**: Secure login and signup using authentication mechanisms.
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop devices.
- **User Profiles**: Customizable user profiles with avatars.
- **Media Sharing**: Share images.
- **Search Functionality**: Quickly find contacts and messages.

## Tech Stack

- **Frontend**: React, Tailwind CSS,Daisy,DaisyUI
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Realtime**: Socket.IO
- **Authentication**: JWT (JSON Web Tokens)
- **Hosting**: Render

## Installation

Follow these steps to set up Wave locally:

### Prerequisites

- Node.js (v14 or higher)
- MongoDB

### Clone the Repository

```bash
https://github.com/vaibhavisno-one/Chat_App
cd wave
```

### Setup

1. Build the App:
   ```bash
   npm run build
   ```
2. Start the App:
   ```bash
   npm start
   ```
3. Setup .env file:
   ```env
    MONGODB_URI=...
    PORT=5001
    JWT_SECRET=...
    CLOUDINARY_CLOUD_NAME=...
    CLOUDINARY_API_KEY=...
    CLOUDINARY_API_SECRET=...
    NODE_ENV=development
    ```

## Usage

1. Register a new account or log in with an existing one.
2. Start a conversation by selecting a user or creating a group chat.
3. Enjoy real-time messaging with features like media sharing and typing indicators.

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository.
2. Create a new branch: `git checkout -b feature-name`.
3. Make your changes and commit them: `git commit -m 'Add new feature'`.
4. Push to the branch: `git push origin feature-name`.
5. Open a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

**Wave - Stay Connected, Stay Chatting!**
