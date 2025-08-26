package com.lms.attendance.model;

import lombok.Data;

@Data
public class CreditInfo {
    private String studentId;
    private int majorCreditTaken;
    private int generalCreditTaken;
    private int majorCreditNeeded;
    private int generalCreditNeeded;
}
