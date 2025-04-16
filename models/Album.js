const mongoose = require('mongoose');

const AlbumSchema = new mongoose.Schema({
  description: {
  type: String
  },
  title: {
    type: String,
    required: true
  },
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artist',
    required: true
  },
  coverImage: {
    type: String,
    default: '/img/default-album.jpg'
  },
  releaseDate: {
    type: Date
  },
  songs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song'
  }],
  genre: {
    type: String
  }
});

module.exports = mongoose.model('Album', AlbumSchema);