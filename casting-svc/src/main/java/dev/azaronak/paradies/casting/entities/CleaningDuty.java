package dev.azaronak.paradies.casting.entities;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;

import java.time.LocalDate;
import java.util.UUID;

@Entity
public class CleaningDuty extends PanacheEntityBase {
    @Id
    UUID id;

    @ManyToOne
    Resident assignedResident;

    LocalDate dueDate;
    String area;
    boolean completed;

    public static CleaningDuty create(Resident resident, LocalDate dueDate, String area) {
        CleaningDuty d = new CleaningDuty();
        d.id = UUID.randomUUID();
        d.assignedResident = resident;
        d.dueDate = dueDate;
        d.area = area;
        d.completed = false;
        return d;
    }

    protected CleaningDuty() {}

    public void markCompleted() { this.completed = true; }
    public void markNotDone() { this.completed = false; }

    public UUID getId() { return id; }
    public Resident getAssignedResident() { return assignedResident; }
    public LocalDate getDueDate() { return dueDate; }
    public String getArea() { return area; }
    public boolean isCompleted() { return completed; }
}
