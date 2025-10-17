# JJ-Meet - Travel-Oriented Dating App 🌍❤️

A unique travel-focused dating application that connects travelers with local guides and fellow explorers.

## 🌟 Key Features

- **Location-based Matching**: Swipe through locals and travelers in your area
- **Local Guide Mode**: Locals can offer to show travelers around
- **Transportation Info**: Display if users have cars/motorcycles
- **Real-time Chat**: Connect with matches instantly
- **Safety Features**: Verification system and reporting mechanisms
- **Tourist/Local Toggle**: Switch between being a guide or seeking one

## 🏗️ Tech Stack

### Backend
- **Node.js + Express**: RESTful API server
- **PostgreSQL + PostGIS**: Database with geospatial capabilities
- **Socket.io**: Real-time chat functionality
- **JWT**: Secure authentication
- **Redis**: Session management and caching
- **Cloudinary**: Image storage

### Frontend
- **React**: Web application (mobile-first design)
- **Redux Toolkit**: State management
- **Socket.io-client**: Real-time communication
- **React Router**: Navigation
- **Tailwind CSS**: Responsive styling
- **React Query**: Data fetching and caching

## 📁 Project Structure

```
jj-meet/
├── backend/               # Node.js Express backend
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Custom middleware
│   │   ├── services/      # Business logic
│   │   ├── utils/         # Utility functions
│   │   └── socket/        # Socket.io handlers
│   ├── config/            # Configuration files
│   └── migrations/        # Database migrations
│
├── frontend/              # React web application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── features/      # Feature modules
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API services
│   │   ├── store/         # Redux store
│   │   └── utils/         # Utility functions
│   └── public/            # Static assets
│
└── docker-compose.yml     # Docker configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)
- Redis
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/jj-meet.git
cd jj-meet
```

2. Install backend dependencies
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
```

3. Install frontend dependencies
```bash
cd ../frontend
npm install
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. Set up the database
```bash
cd ../backend
npm run db:migrate
npm run db:seed  # Optional: seed with sample data
```

5. Start the development servers

Backend:
```bash
cd backend
npm run dev
```

Frontend (in another terminal):
```bash
cd frontend
npm start
```

## 🔐 Environment Variables

### Backend (.env)
```
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/jjmeet
JWT_SECRET=your_jwt_secret
REDIS_URL=redis://localhost:6379
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
GOOGLE_MAPS_API_KEY=your_google_maps_key
```

### Frontend (.env.local)
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_GOOGLE_MAPS_KEY=your_google_maps_key
```

## 📱 Mobile Migration Path

The frontend is built with mobile-first responsive design, making it easy to:
1. Wrap in React Native WebView for quick mobile app
2. Migrate to React Native using similar component structure
3. Share Redux store and API services between web and mobile

## 🔒 Safety Features

- Email/Phone verification
- Photo verification system
- User reporting mechanism
- Rating and review system
- Emergency contact sharing
- Meeting location suggestions (public places)

## 🗺️ Core User Flows

1. **Registration**: Sign up as Tourist or Local Guide
2. **Profile Setup**: Add photos, bio, interests, transportation options
3. **Discovery**: Swipe through profiles based on location
4. **Matching**: Mutual likes create a match
5. **Chat**: Real-time messaging with matches
6. **Meetup**: Plan safe meetings with location sharing

## 📊 Database Schema

- **Users**: Profile information, preferences
- **Locations**: User locations with PostGIS
- **Matches**: Swipe history and matches
- **Messages**: Chat messages
- **Reviews**: User ratings and feedback
- **Reports**: Safety reports and blocks

## 🚦 API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/users/nearby` - Get nearby users
- `POST /api/swipes` - Record swipe action
- `GET /api/matches` - Get user matches
- `POST /api/messages` - Send message
- `GET /api/messages/:matchId` - Get chat history

## 👥 Contributing

Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Inspired by the need for safe, travel-oriented social connections
- Built with modern web technologies for scalability
- Designed with user safety as a priority
