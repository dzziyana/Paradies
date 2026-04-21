package dev.azaronak.paradies.casting.auth;

import dev.azaronak.paradies.casting.entities.Resident;
import jakarta.enterprise.context.RequestScoped;

/**
 * Request-scoped holder for the currently authenticated resident.
 * Set by {@link AuthFilter}, consumed by resources.
 */
@RequestScoped
public class AuthenticatedUser {
    private Resident resident;

    public Resident get() { return resident; }
    public void set(Resident resident) { this.resident = resident; }
    public boolean isPresent() { return resident != null; }
}
