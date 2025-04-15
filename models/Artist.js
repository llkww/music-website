const mongoose = require('mongoose');

const ArtistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  bio: {
    type: String
  },
  image: {
    type: String,
    default: '/img/default-artist.jpg'
  },
  genres: [{
    type: String
  }],
  albums: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Album'
  }],
  popularSongs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song'
  }],
  followers: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('Artist', ArtistSchema);