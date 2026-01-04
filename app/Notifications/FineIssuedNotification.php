<?php

namespace App\Notifications;

use App\Models\Fine;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class FineIssuedNotification extends Notification
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
        return (new MailMessage)
            ->subject('Dorm Fine Issued: '.$this->fine->fine_code)
            ->greeting('Hello '.$notifiable->name)
            ->line('A new dorm fine has been issued to you.')
            ->line('Fine ID: '.$this->fine->fine_code)
            ->line('Category: '.$this->fine->category)
            ->line('Amount: RM '.number_format((float)$this->fine->amount_rm, 2))
            ->line('Due Date: '.$this->fine->due_date->format('Y-m-d'))
            ->line('Reason: '.($this->fine->reason ?: '-'))
            ->action('View Details', url(route('student.fines.show', $this->fine->id)))
            ->line('Please settle the fine before the due date.');
    }
}
