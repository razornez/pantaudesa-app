export async function uploadUserAvatar(file: File | Blob, filename: string) {
  const form = new FormData();
  form.append("file", file, filename);

  const response = await fetch("/api/users/avatar", {
    method: "POST",
    body: form,
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? "Gagal mengupload foto.");
  }

  return data as { avatarUrl: string };
}

export async function updateUserPin(input: {
  currentPin: string;
  newPin: string;
  confirmPin: string;
}) {
  const response = await fetch("/api/users/pin", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await response.json();

  if (!response.ok) {
    throw data as { error?: string; field?: string };
  }

  return data;
}

export async function updateUserProfile(input: { nama: string; bio: string }) {
  const response = await fetch("/api/users/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Gagal menyimpan");
  }
}
