# Multiplayer-Ludo-Game

A real-time multiplayer Ludo game built with React and Vite. Play classic Ludo with friends online, featuring wallet integration, game history tracking, and admin controls. Automated players will join the game if real player does not with in 30-50 seconds.

## 🎮 Features

- **Real-time Multiplayer Gameplay**: Play Ludo with 2 players using Socket.io for real-time synchronization
- **User Authentication**: Secure login system with JWT token management
- **Automated Players**: Bots which joins you and play along as human
- **Wallet System**: Deposit and withdraw funds using Manual payment integration
- **Game History**: Track all your past games and results
- **Profile Management**: View and manage your profile, transactions, and game statistics
- **Admin Controls**: Admin panel for managing game settings, prize configurations, and monitoring games
- **Customizable Victory Conditions**: Choose between fast games (1 piece) or classic games (4 pieces)
- **Responsive UI**: Built with Material-UI and Tailwind CSS for a modern, responsive design

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn package manager

### Installation

1. Clone the repository:

```bash
git clone https://github.com/Gadisaka/Multiplayer-Ludo-Game.git
cd Multiplayer-Ludo-Game
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3333`

## 📦 Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the project for production
- `npm run preview` - Preview the production build
- `npm run lint` - Run ESLint to check code quality

## 🏗️ Project Structure

```
offset-ludo/
├── src/
│   ├── components/       # Reusable React components
│   │   ├── Ludoboard.jsx # Main game board component
│   │   ├── Token.jsx     # Game token component
│   │   └── ...
│   ├── context/          # React context providers
│   │   ├── GameContext.jsx
│   │   └── SocketContext.jsx
│   ├── hooks/            # Custom React hooks
│   ├── logic/            # Game logic and path calculations
│   ├── page/             # Page components
│   │   ├── auth/         # Authentication pages
│   │   ├── profile/      # Profile and wallet pages
│   │   └── ...
│   ├── store/            # Zustand state management stores
│   ├── socket.js         # Socket.io client configuration
│   └── App.jsx           # Main application component
├── public/               # Static assets
├── docs/                 # Documentation
│   └── gamerules.md      # Game rules documentation
└── package.json
```

## 🎯 Game Rules

- **Players**: 2 players per game
- **Starting**: Players need to roll a 6 to move a piece out of the base
- **Movement**: Pieces move clockwise based on die roll result
- **Cutting**: Players can cut opponents' pieces, sending them back to base
- **Victory**: First player to finish all pieces (or configured number) wins
- **Victory Settings**: Configurable win conditions (1, 2, or 4 pieces)

For detailed game rules, see [docs/gamerules.md](docs/gamerules.md)

## 🛠️ Tech Stack

- **Frontend Framework**: React 19
- **Build Tool**: Vite
- **State Management**: Zustand
- **Styling**:
  - Tailwind CSS
  - Styled Components
- **Real-time Communication**: Socket.io Client
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Audio**: Howler.js
- **Icons**: React Icons, Lucide React, MUI Icons

## 🔐 Authentication & Security

- JWT-based authentication
- Protected routes for authenticated users
- Secure token storage and management

## 💰 Wallet & Payments

- Integrated wallet system for managing game funds
- Deposit functionality via Manual payment gateway
- Withdraw funds to your account
- Transaction history tracking

## 📱 Pages & Routes

- `/` - Home page
- `/login` - User authentication
- `/game` - Game lobby
- `/game/:gameID` - Active game room
- `/profile` - User profile
- `/history` - Game history
- `/notification` - Notifications
- `/deposit` - Deposit funds
- `/withdraw` - Withdraw funds

## 🌐 Deployment

The project is configured for deployment on Vercel. See `vercel.json` for deployment configuration.

## 📝 License

This project is private and proprietary.

## 🤝 Contributing

This is a private project. For contributions or questions, please contact me gadisaka04@gmail.com
