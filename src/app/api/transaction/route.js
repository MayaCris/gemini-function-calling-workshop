import { NextResponse } from "next/server";
import db from "@/data/db.json";
import { extractData } from "../genia";

export async function GET() {
  return NextResponse.json(db);
}

export async function POST (request){
  const formData = await request.formData();
  console.log("formData", formData)
  const description = formData.get("description");
  const picture = formData.get("picture");
  
  return createTransaction(description, picture);

}

async function createTransaction(description, picture){
  try {
    const result = await extractData(description, picture);
    if (!result.date) {
      result.date = new Date().toISOString();
    }
    
    console.log("ResultCreateTransaction", result)
    return NextResponse.json({ transaction : result});
  } catch (error) {
    return new NextResponse(null, {
      status: 500,
      statusNext: error.message,
    })
  }
}
