package dev.azaronak.paradies.casting.entities;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;

import java.time.LocalDate;
import java.util.UUID;

@Entity
public class CalendarEntry extends PanacheEntityBase {
    @Id
    UUID id;

    String title;
    LocalDate startDate;
    LocalDate endDate;
    String time; // "HH:MM" for point-wise events, null for multi-day
    int color;

    @Enumerated(EnumType.STRING)
    CalendarEntryCategory category;

    @ManyToOne
    Resident resident; // optional — links absences to a specific resident

    public static CalendarEntry create(String title, LocalDate startDate, LocalDate endDate,
                                       String time, int color, CalendarEntryCategory category,
                                       Resident resident) {
        CalendarEntry e = new CalendarEntry();
        e.id = UUID.randomUUID();
        e.title = title;
        e.startDate = startDate;
        e.endDate = endDate;
        e.time = time;
        e.color = color;
        e.category = category;
        e.resident = resident;
        return e;
    }

    protected CalendarEntry() {}

    public UUID getId() { return id; }
    public String getTitle() { return title; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getEndDate() { return endDate; }
    public String getTime() { return time; }
    public int getColor() { return color; }
    public CalendarEntryCategory getCategory() { return category; }
    public Resident getResident() { return resident; }
}
