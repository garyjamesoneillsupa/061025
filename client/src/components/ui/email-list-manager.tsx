import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Mail } from "lucide-react";
import { z } from "zod";

interface EmailListManagerProps {
  emails: string[];
  onChange: (emails: string[]) => void;
  placeholder?: string;
  label?: string;
  maxEmails?: number;
}

export function EmailListManager({ 
  emails, 
  onChange, 
  placeholder = "Enter email address",
  label = "Email Addresses",
  maxEmails = 10
}: EmailListManagerProps) {
  const [newEmail, setNewEmail] = useState("");
  const [error, setError] = useState("");

  const addEmail = () => {
    const trimmedEmail = newEmail.trim();
    
    if (!trimmedEmail) {
      setError("Email cannot be empty");
      return;
    }

    // Validate email format
    const emailSchema = z.string().email();
    const validation = emailSchema.safeParse(trimmedEmail);
    
    if (!validation.success) {
      setError("Please enter a valid email address");
      return;
    }

    if (emails.includes(trimmedEmail)) {
      setError("Email already exists in the list");
      return;
    }

    if (emails.length >= maxEmails) {
      setError(`Maximum ${maxEmails} emails allowed`);
      return;
    }

    onChange([...emails, trimmedEmail]);
    setNewEmail("");
    setError("");
  };

  const removeEmail = (emailToRemove: string) => {
    onChange(emails.filter(email => email !== emailToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEmail();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium">{label}</span>
        {emails.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {emails.length} {emails.length === 1 ? 'email' : 'emails'}
          </Badge>
        )}
      </div>
      
      {/* Email List */}
      {emails.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {emails.map((email, index) => (
            <Badge key={index} variant="outline" className="flex items-center gap-1 pr-1">
              <span className="text-xs">{email}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-red-100"
                onClick={() => removeEmail(email)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Add Email Input */}
      <div className="flex gap-2">
        <Input
          type="email"
          value={newEmail}
          onChange={(e) => {
            setNewEmail(e.target.value);
            setError("");
          }}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className={error ? "border-red-500" : ""}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addEmail}
          disabled={emails.length >= maxEmails}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {/* No emails message */}
      {emails.length === 0 && (
        <p className="text-xs text-gray-500">
          No email addresses added yet. Add recipients who should receive documents.
        </p>
      )}
    </div>
  );
}