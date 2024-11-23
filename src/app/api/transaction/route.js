import { NextResponse } from "next/server";
import db from "@/data/db.json";

export async function GET() {
  return NextResponse.json(db);
}

export async function POST (request){
  return new NextResponse(null, {
    status: 500,
    statusText: "Not implemented",
  });
}

async function createTransaction(description, picture){
  try {
    
  } catch (error) {
    return new NextResponse(null, {
      status: 500,
      statusNext: error.message,
    })
  }
}
