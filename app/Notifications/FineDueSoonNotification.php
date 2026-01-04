<?php

namespace App\Notifications;

use App\Models\Fine;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class FineDueSoonNotification extends Notification
{
    use Queueable;

    public function __construct(public Fine $fine)
    {
    }

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        $days = now()->diffInDays($this->fine->due_date, false);
        return (new MailMessage)
            ->subject('Dorm Fine Due Soon: '.$this->fine->fine_code)
            ->greeting('Hello '.$notifiable->name)
            ->line('Your dorm fine is approaching its due date.')
            ->line('Fine ID: '.$this->fine->fine_code)
            ->line('Amount: RM '.number_format((float)$this->fine->amount_rm, 2))
            ->line('Due Date: '.$this->fine->due_date->format('Y-m-d').' (in '.max(0, $days).' days)')
            ->action('View Details', url(route('student.fines.show', $this->fine->id)))
            ->line('Please settle the fine before the due date.');
    }
}
