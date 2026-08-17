import { useState } from "react";
import { Modal, Button, Input } from "./ui";
import api, { apiError } from "../lib/api";
import { toast } from "sonner";

export default function AddContactModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: "", email: "", company: "", title: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/contacts", form);
      toast.success("Contact added");
      onCreated?.(data.data);
      onClose();
    } catch (err) {
      toast.error(apiError(err.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Add contact" testid="add-contact-modal">
      <form onSubmit={submit}>
        <Input label="Name" value={form.name} onChange={set("name")} testid="contact-name-input" required />
        <Input label="Email" type="email" value={form.email} onChange={set("email")} testid="contact-email-input" required />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Company" value={form.company} onChange={set("company")} testid="contact-company-input" />
          <Input label="Title" value={form.title} onChange={set("title")} testid="contact-title-input" />
        </div>
        <Input label="Phone" value={form.phone} onChange={set("phone")} testid="contact-phone-input" />
        <Button type="submit" disabled={loading} className="w-full" testid="save-contact-btn">
          {loading ? "Saving…" : "Add contact"}
        </Button>
      </form>
    </Modal>
  );
}
