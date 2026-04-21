package dev.azaronak.paradies.casting.presentation;

import dev.azaronak.paradies.casting.entities.Room;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;

import java.util.List;
import java.util.UUID;

@Path("/rooms")
public class RoomResource {

    public record CreateRoomRequest(String roomNumber, int floor, double sizeM2, String description, String photo, String photoMimeType) {}

    @GET
    public List<Room> list() {
        return Room.listAll();
    }

    @GET
    @Path("/{id}")
    public Room get(@PathParam("id") UUID id) {
        Room r = Room.findById(id);
        if (r == null) throw new NotFoundException("Room not found");
        return r;
    }

    @POST
    @Transactional
    public UUID create(CreateRoomRequest req) {
        Room r = Room.create(req.roomNumber(), req.floor(), req.sizeM2(), req.description(), req.photo(), req.photoMimeType());
        r.persist();
        return r.getId();
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public void delete(@PathParam("id") UUID id) {
        Room r = Room.findById(id);
        if (r == null) throw new NotFoundException("Room not found");
        r.delete();
    }
}
