import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ไม่พบ API Key ในระบบหลังบ้าน' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'กรุณาส่งข้อความที่ต้องการตรวจสอบมาด้วย' },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // 💡 อัปเดต Prompt ใหม่: เพิ่มการจัดเรียงไทยขึ้นก่อน และสั่งให้ตรวจสอบซ้ำ 2-3 รอบ
    const prompt = `
      คุณคือผู้เชี่ยวชาญระดับสูงด้านบรรณานุกรม APA 7th Edition
      กรุณาตรวจสอบ แก้ไข และจัดรูปแบบข้อความต่อไปนี้ให้ถูกต้องตามหลัก APA 7th Edition:

      "${text}"
      
      ข้อกำหนดสำคัญ (ต้องทำตามอย่างเคร่งครัด):
      1. การจัดเรียงลำดับ (Sorting): ต้องแยกกลุ่มรายการบรรณานุกรมภาษาไทยและภาษาอังกฤษออกจากกัน โดย **"ต้องนำรายการภาษาไทยทั้งหมด ขึ้นก่อน ภาษาอังกฤษเสมอ"** และในแต่ละกลุ่มภาษาให้จัดเรียงตามลำดับตัวอักษร (ก-ฮ และ A-Z)
      2. ตรวจสอบความถูกต้อง (Double Check): ก่อนส่งคำตอบผลลัพธ์สุดท้าย ให้คุณทำการตรวจสอบและทบทวนสิ่งที่ตัวเองแก้ไขซ้ำ 2-3 รอบ เพื่อให้แน่ใจว่าถูกต้องตามหลัก APA 7 ทั้งหมดแล้ว
      3. ใช้เครื่องหมาย *ข้อความ* สำหรับส่วนที่ต้องเป็นตัวเอียงตามหลัก APA 7 (เช่น ชื่อหนังสือ ชื่อวารสาร เลขเล่มที่)
      4. หากมีหลายรายการ ให้คั่นแต่ละรายการด้วยการเว้นบรรทัด 2 ครั้ง (Double newlines) เสมอ เพื่อให้ระบบแสดงผลแยกบรรทัดได้ถูกต้อง
      5. ให้คุณตอบกลับมาโดยแบ่งเนื้อหาเป็น 2 ส่วน คั่นด้วยเครื่องหมาย ||| (ท่อ 3 ขีด) ดังนี้:
      
      ส่วนที่ 1: ผลลัพธ์บรรณานุกรมที่จัดรูปแบบและเรียงลำดับถูกต้องแล้วเท่านั้น (ห้ามมีคำนำหน้าใดๆ)
      |||
      ส่วนที่ 2: คำอธิบายสั้นๆ เป็นข้อๆ (Bullet points) ว่าคุณแก้ไขหรือจัดรูปแบบจุดไหนไปบ้าง (เช่น จัดเรียงภาษาไทยขึ้นก่อนภาษาอังกฤษ, แก้ไขตัวเอียง, ฯลฯ)
    `;

    const aiResult = await model.generateContent(prompt);
    const response = await aiResult.response;
    const generatedText = response.text();

    return NextResponse.json({ result: generatedText.trim() });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI' },
      { status: 500 }
    );
  }
}