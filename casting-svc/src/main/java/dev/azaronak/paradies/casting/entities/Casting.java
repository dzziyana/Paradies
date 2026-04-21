package dev.azaronak.paradies.casting.entities;
import com.fasterxml.jackson.annotation.JsonIgnore;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Entity
public class Casting extends PanacheEntityBase {
    @Id
    UUID id;
    LocalDate moveInDate;
    LocalDate moveOutDate;
    LocalDateTime time;
    String replacedPersonName;
    LocalDate applicationUntil;
    boolean applicationOpen = true;
    boolean sublet = false;

    @ManyToOne
    Room room;

    @OneToMany(mappedBy = "casting")
    @JsonIgnore
    Set<Application> applications;

    public UUID getId() { return id; }
    public LocalDate getMoveInDate() { return moveInDate; }
    public LocalDate getMoveOutDate() { return moveOutDate; }
    public LocalDateTime getTime() { return time; }
    public String getReplacedPersonName() { return replacedPersonName; }
    public LocalDate getApplicationUntil() { return applicationUntil; }
    public boolean isApplicationOpen() { return applicationOpen; }
    public boolean isSublet() { return sublet; }

    public boolean isApplicationPeriodActive() {
        return applicationOpen && (applicationUntil == null || !applicationUntil.isBefore(LocalDate.now()));
    }

    public static Casting create(LocalDate moveInDate, LocalDate moveOutDate, String replacedPersonName, LocalDate applicationUntil, boolean sublet) {
        return new Casting(UUID.randomUUID(), moveInDate, moveOutDate, replacedPersonName, applicationUntil, sublet, new HashSet<>());
    }

    private Casting(UUID id, LocalDate moveIn, LocalDate moveOut, String replacedPersonName, LocalDate applicationUntil, boolean sublet, Set<Application> apps) {
        this.id = id;
        this.moveInDate = moveIn;
        this.moveOutDate = moveOut;
        this.replacedPersonName = replacedPersonName;
        this.applicationUntil = applicationUntil;
        this.applicationOpen = true;
        this.sublet = sublet;
        this.applications = apps;
    }

    protected Casting() {
    }

    public void addApplication(Application app) {
        this.applications.add(app);
        app.setCasting(this);
    }

    @JsonIgnore
    public Set<Application> getApplications() {
        return this.applications;
    }

    public int getApplicationCount() {
        return this.applications.size();
    }

    public long getUnevaluatedCount() {
        return this.applications.stream()
                .filter(a -> a.getStatus() == null || a.getStatus() == AppStatus.PENDING || a.getStatus() == AppStatus.SUBMITTED)
                .count();
    }

    public void setTime(LocalDateTime time) {
        this.time = time;
    }

    public void closeApplicationPeriod() {
        this.applicationOpen = false;
    }

    public void setApplicationUntil(LocalDate date) {
        this.applicationUntil = date;
    }

    public Room getRoom() { return room; }

    public void setRoom(Room room) { this.room = room; }
}
