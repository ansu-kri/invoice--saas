

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const reminderService = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No auth token found");

    const response = await fetch(`${API_URL}/api/invoices/reminder-service`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to send reminder emails");
    }

    const data = await response.json();
    return data; // { message: "Reminder emails sent successfully", total: X }

  } catch (error: any) {
    console.error("ReminderService error:", error);
    throw new Error(error.message || "Something went wrong with reminder service");
  }
};