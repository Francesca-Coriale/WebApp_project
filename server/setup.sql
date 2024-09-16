BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "theaters" (
	"id"	INTEGER,
	"name"	TEXT NOT NULL,
    "size"	TEXT NOT NULL,
	"rows"	INTEGER,
	"columns"	INTEGER,
	"seats"	INTEGER,
	PRIMARY KEY("id" AUTOINCREMENT) 
);

CREATE TABLE IF NOT EXISTS "users" (
	"id"	INTEGER,
	"email"	TEXT NOT NULL,
	"name"	TEXT,
	"hash"	TEXT NOT NULL,
	"salt"	TEXT NOT NULL,
    "loyalty"	INTEGER NOT NULL DEFAULT (0),
	PRIMARY KEY("id" AUTOINCREMENT)
);

CREATE TABLE IF NOT EXISTS "concerts" (
    "id"    INTEGER PRIMARY KEY AUTOINCREMENT,
    "concert" TEXT NOT NULL,
    "theater" INTEGER,
    FOREIGN KEY ("theater") REFERENCES "theaters" ("id")
);

CREATE TABLE IF NOT EXISTS "reservations" (
    "reservation_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "concert_id" INTEGER NOT NULL,
    "concert_name" TEXT NOT NULL,
    "row" INTEGER NOT NULL,
    "place" TEXT NOT NULL,
    "user" INTEGER,
    FOREIGN KEY ("concert_id") REFERENCES "concerts" ("id"),
    FOREIGN KEY ("concert_name") REFERENCES "concerts" ("concert"),
    FOREIGN KEY ("user") REFERENCES "users" ("id")
);

CREATE TRIGGER update_seats_before_insert
AFTER INSERT ON "theaters"
FOR EACH ROW
BEGIN
    UPDATE "theaters"
    SET "seats" = NEW."rows" * NEW."columns"
    WHERE "id" = NEW."id";
END;

INSERT INTO "theaters" ("name", "size", "rows", "columns") VALUES
('Teatro Gioiello', 'Small', 4, 8),
('Teatro Colosseo', 'Medium', 6, 10),
('Teatro Alfieri', 'Large', 9, 14);

INSERT INTO "users" ("email", "name", "hash", "salt", "loyalty") VALUES
('user1@exam.com', 'John Doe', '9ba3908a864f456c12ed64273ed50809a3b7f2050169a782f2cf0db576b114b69a966b1bda25b32e4fadd62abc9c5094f8839979d3e941f74422c3ee70795828', 'ea67303a22d6d08abf812c67a5b31172', 1),
('user2@exam.com', 'Alice Smith', 'f8f1576d7dadc9e819d94ed9edf81819e78993f2a41493730917d1ab630ff28cecb90045dc76300e19354392d62088eb59802339618a4b8283c28e12c1b83082', '3d6faa7c148704a315397ba84d855669', 1),
('user3@exam.com', 'Bob Johnson', '27d39ca48948af22080980283a50b2788d58221a5f26776559708b925a9466b9e8aac78bfc2f428935ad67e3addd4ce8cdb55b2ea86ce6a4243f74ab7bda047b', 'c687d2391a01770c7586100e3b5bd79b', 0),
('user4@exam.com', 'Mary Davis', '6a7ee697397b65647dcf8601ce31db40cc189c248daee0e0ab4e17b367b03fdaaa53fe9410a60b403f9a8e30eff2ddd50c0b30759efbaecdc2dcc333efc96fc0', 'b711bf33144faaaefba95407854d20b6', 0),
('user5@exam.com', 'James Brown', '5b77b0ef4af5ee30bbc005de3d1fe1e804e72691bd067f455b733686bae021d646000defd7b7771e8bc2262d07865b77e8ea5d79b43cf6710a31719f919fd978', '0f0ade5ff93bc83b763d8c4fc27b8a97', 1),
('user6@exam.com', 'Linda Wilson', 'fccda2ebc498ad741e698116161be98e5f647b7e4a39bc1f8a6cebffef448c3f4c04237358cc265e9c658f8ca7528f6c655da46375c2e512fde80e07b585b8c5', '5745c8d563f0a218cabe9e229ad0a2e5', 0);

INSERT INTO "concerts" ("concert", "theater") VALUES
('Rock Fest', 1),   -- Concert 1 at Theater A (Small)
('Jazz Night', 1),   -- Concert 2 at Theater A (Small)
('Pop Extravaganza', 2),   -- Concert 3 at Theater B (Medium)
('Classical Evening', 2),   -- Concert 4 at Theater B (Medium)
('Opera Gala', 3),   -- Concert 5 at Theater C (Large)
('Broadway Hits', 3);   -- Concert 6 at Theater C (Large)

INSERT INTO "reservations" ("concert_id", "concert_name", "row", "place", "user") VALUES
(1, 'Rock Fest', 1, 'A', 1),        -- Reservation 1 for Rock Fest, Row 1, Place A, User 1
(1, 'Rock Fest', 1, 'B', 1),        -- Reservation 2 for Rock Fest, Row 1, Place B, User 1
(5, 'Opera Gala', 1, 'A', 1),       -- Reservation 3 for Opera Gala, Row 1, Place A, User 1
(5, 'Opera Gala', 1, 'B', 1),       -- Reservation 4 for Opera Gala, Row 1, Place B, User 1
(1, 'Rock Fest', 2, 'C', 2),        -- Reservation 5 for Rock Fest, Row 2, Place C, User 2
(1, 'Rock Fest', 2, 'D', 2),        -- Reservation 6 for Rock Fest, Row 2, Place D, User 2
(5, 'Opera Gala', 2, 'C', 2),       -- Reservation 7 for Opera Gala, Row 2, Place C, User 2
(5, 'Opera Gala', 2, 'D', 2),       -- Reservation 8 for Opera Gala, Row 2, Place D, User 2
(5, 'Opera Gala', 2, 'E', 2),       -- Reservation 9 for Opera Gala, Row 2, Place E, User 2
(5, 'Opera Gala', 2, 'F', 2),       -- Reservation 10 for Opera Gala, Row 2, Place F, User 2
(5, 'Opera Gala', 2, 'G', 2),       -- Reservation 11 for Opera Gala, Row 2, Place G, User 2
(1, 'Rock Fest', 3, 'E', 3),        -- Reservation 12 for Rock Fest, Row 3, Place E, User 3
(1, 'Rock Fest', 3, 'F', 3),        -- Reservation 13 for Rock Fest, Row 3, Place F, User 3
(1, 'Rock Fest', 3, 'G', 3),        -- Reservation 14 for Rock Fest, Row 3, Place G, User 3
(1, 'Rock Fest', 3, 'H', 3),        -- Reservation 15 for Rock Fest, Row 3, Place H, User 3
(5, 'Opera Gala', 3, 'A', 3),       -- Reservation 16 for Opera Gala, Row 3, Place A, User 3
(5, 'Opera Gala', 3, 'B', 3),       -- Reservation 17 for Opera Gala, Row 3, Place B, User 3
(1, 'Rock Fest', 4, 'E', 4),        -- Reservation 12 for Rock Fest, Row 4, Place E, User 4
(1, 'Rock Fest', 4, 'F', 4),        -- Reservation 13 for Rock Fest, Row 4, Place F, User 4
(1, 'Rock Fest', 4, 'G', 4),        -- Reservation 14 for Rock Fest, Row 4, Place G, User 4
(1, 'Rock Fest', 4, 'H', 4),        -- Reservation 15 for Rock Fest, Row 4, Place H, User 4
(5, 'Opera Gala', 4, 'A', 4),       -- Reservation 18 for Opera Gala, Row 4, Place A, User 4
(5, 'Opera Gala', 4, 'B', 4);       -- Reservation 19 for Opera Gala, Row 4, Place B, User 4

COMMIT;