// import mongoose from "mongoose";

// export async function connectDB(uri: string): Promise<void> {
//   mongoose.set("strictQuery", true);
//   await mongoose.connect(uri);
//   console.log("MongoDB connected");
// }

import mongoose from "mongoose";

export async function connectDB(uri: string): Promise<void> {
  mongoose.set("strictQuery", true);

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection event:", err);
  });

  console.log("Connecting to MongoDB Atlas...");

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("MongoDB connected successfully");
  } catch (err: any) {
    console.error("Connection error name:", err.name);
    console.error("Connection error message:", err.message);
    console.error("Detailed cause:", err.cause);
    console.dir(err.reason, { depth: 6 });
    throw err;
  }
}