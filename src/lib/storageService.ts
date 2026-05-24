import { supabase } from "./supabase";

export async function uploadGuestDocument(
  file: File,
  guestId: string
) {
  try {
    const ext = file.name.split(".").pop();

    const fileName = `${guestId}-${Date.now()}.${ext}`;

    const filePath = `documents/${fileName}`;

    const { error } = await supabase.storage
      .from("guest-documents")
      .upload(filePath, file);

    if (error) {
      console.error(error);
      return null;
    }

    const { data } = supabase.storage
      .from("guest-documents")
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (err) {
    console.error(err);
    return null;
  }
}