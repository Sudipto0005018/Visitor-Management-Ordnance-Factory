CREATE TABLE visitor_fingerprints (
    id INT NOT NULL AUTO_INCREMENT,
    visitor_id INT NOT NULL,
    fp TEXT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_visitor 
        FOREIGN KEY (visitor_id) 
        REFERENCES visitors_a1b2c3d4(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;