// lib/currentUser.ts
//
// ชั่วคราว! ใช้ mock user id แทนของจริง เพราะยังไม่ได้ทำระบบ login เสร็จ
// พอทำ auth จริงเสร็จแล้ว (Supabase Auth หรือระบบ session เอง)
// ให้แก้แค่ไฟล์นี้ไฟล์เดียว ไม่ต้องไปตามแก้ทุกหน้าที่เรียกใช้
//
// TODO: เปลี่ยนตรงนี้เป็นของจริง เช่น
//   const { data: { user } } = await supabase.auth.getUser();
//   return user?.id ?? null;
// หรือถ้าทำ session เอง ก็ดึงจาก cookie / lib/session.ts แทน

const MOCK_STUDENT_ID = "11111111-1111-1111-1111-111111111111";
const MOCK_ADVISOR_ID = "22222222-2222-2222-2222-222222222222";

export async function getCurrentStudentId(): Promise<string | null> {
  return MOCK_STUDENT_ID;
}

export async function getCurrentAdvisorId(): Promise<string | null> {
  return MOCK_ADVISOR_ID;
}
