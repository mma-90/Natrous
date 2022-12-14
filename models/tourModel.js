import { query } from "express";
import mongoose from "mongoose";
import slugify from "slugify";
import AppError from "./../utils/AppError.js";

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A tour must have a name"],
      trim: true,
      unique: true,
      maxlength: [40, "A tour name must have less or equal then 40 characters"],
      minlength: [10, "A tour name must have more or equal then 10 characters"],
    },

    summary: {
      type: String,
      required: [true, "A tour must have a summary"],
      trim: true,
    },

    description: {
      type: String,
      required: [true, "A tour must have a description"],
      trim: true,
    },

    duration: {
      type: Number,
      required: [true, "A tour must have a duration"],
    },

    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a group size"],
    },

    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Difficulty is either: easy, medium, difficult",
      },
    },

    price: {
      type: Number,
      required: [true, "A tour must have a price"],
    },

    // TODO: make sure discount not exceed tour price
    // discount: {
    //   type: Number,
    //   validate: {
    //     // work in creating new doc only
    //     validator: function (val) {
    //       console.log(val, this.price);
    //       return this.price > val;
    //     },
    //     message: "Discount must be less than a Tour price",
    //   },
    // },

    discount: Number,

    imageCover: {
      type: String,
      required: [true, "A tour must have a cover image"],
    },

    images: [String],

    ratingsAverage: {
      type: Number,
      default: 5,
      min: [1, "Tour rating must be between [1,5]"],
      max: [5, "Tour rating must be between [1,5]"],
    },

    ratingsQuantity: {
      type: Number,
      default: 0,
    },

    startDates: [Date],

    slug: String,

    secretTour: {
      type: Boolean,
      default: false,
    },

    startLocation: {
      // GeoJSON
      type: {
        type: String,
        enum: ["Point"], // Point, Polygon, Line ....
        default: "Point",
      },
      coordinates: [Number],
      address: String,
      description: String,
    },

    locations: [
      {
        address: String,
        description: String,
        day: Number,
        type: {
          type: String,
          default: "Point",
        },
        coordinates: [Number],
      },
    ],

    guides: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

//create index for startLocation
tourSchema.index({ startLocation: "2dsphere" });

// tourSchema.pre("validate",function (val) {
//   console.log(this);
//   return this.price > val;
// });

//Model Middleware: create auto slug for document in creation
tourSchema.pre("save", function (next) {
  //this is created doc
  this.slug = slugify(this.name, { lower: true });
  next();
});

//Query Middleware
// assume that secret tours not supposed to displayed in list result
tourSchema.pre("find", function (next) {
  //this here is query
  // do query as I want
  this.find({ secretTour: { $ne: true } });
  next();
});

//track reviews virtualy as there is no reviews in schema
tourSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id", // tour primary key
  foreignField: "tour", // name of foriegn key on review doc
});

//populate tours
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: "guides",
    // match: { age: { $gte: 21 } },
    select: "name email photo",
  });

  this.populate({
    path: "reviews",
    select: "review rating",
  });

  next();
});

//Query Middleware
// assume that secret tours not supposed to displayed in list result
// tourSchema.pre("aggregate", function (next) {
//   //this here is query
//   // do query as I want
//   // this.find({ secretTour: { $ne: true } });

//   next();
// });

// create virtual properties
tourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

export default mongoose.model("Tour", tourSchema);
