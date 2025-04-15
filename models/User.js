const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: '/img/default-avatar.png'
  },
  phone: {
    type: String
  },
  bio: {
    type: String,
    default: '这个人很懒，什么都没留下...'
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: 'other'
  },
  birthday: {
    type: Date
  },
  isVIP: {
    type: Boolean,
    default: false
  },
  vipExpiry: {
    type: Date
  },
  vipLevel: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  likedSongs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song'
  }],
  likedAlbums: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Album'
  }],
  likedPlaylists: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Playlist'
  }],
  recentPlayed: [{
    song: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Song'
    },
    playedAt: {
      type: Date,
      default: Date.now
    }
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  followingArtists: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artist'
  }],
  preference: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    language: {
      type: String,
      default: 'zh'
    },
    quality: {
      type: String,
      enum: ['standard', 'high', 'lossless'],
      default: 'standard'
    }
  },
  loginHistory: [{
    ip: String,
    device: String,
    time: {
      type: Date,
      default: Date.now
    }
  }]
});

// 密码加密
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// 验证密码
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);