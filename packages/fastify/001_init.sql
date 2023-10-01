DROP TABLE infobox;
DROP TABLE jobinfo;
DROP TABLE hrinfo;
DROP TABLE corpinfo;
DROP TABLE userinfo;
DROP TABLE users;

CREATE TABLE users (
    email     text NOT NULL,
    password  text NOT NULL,
    hr        boolean NOT NULL,
    uuid      uuid NOT NULL,
    PRIMARY KEY ( uuid ),
    UNIQUE ( email )
);

CREATE TABLE userinfo (
    name      text NOT NULL,
    id        text NOT NULL,
    avatar    text NOT NULL,
    phone     text NOT NULL,
    location  text NOT NULL,
    cv        text NOT NULL DEFAULT '',
    valid     boolean NOT NULL DEFAULT false,
    uuid      uuid NOT NULL,
    PRIMARY KEY ( uuid ),
    UNIQUE ( id, avatar, phone, cv )
);

CREATE TABLE hrinfo (
    name      text NOT NULL,
    hrid      text NOT NULL,
    corpid    text NOT NULL,
    avatar    text NOT NULL,
    phone     text NOT NULL,
    uuid      uuid NOT NULL,
    PRIMARY KEY ( uuid ),
    UNIQUE ( avatar, phone )
);

CREATE TABLE corpinfo (
    corpname  text NOT NULL,
    corpid    text NOT NULL,
    logo      text NOT NULL,
    brief     text NOT NULL,
    chiefhr   text NOT NULL,
    valid     boolean NOT NULL DEFAULT false,
    PRIMARY KEY ( corpid ),
    UNIQUE ( logo )
);

CREATE TYPE jobtype AS ENUM ( 'full-time', 'part-time' );

CREATE TABLE jobinfo (
    position  text NOT NULL,
    type      jobtype NOT NULL,
    salary    numrange NOT NULL,
    brief     text NOT NULL,
    location  text NOT NULL,
    corpid    text NOT NULL,
    no        serial,
    cvlist    text[] NOT NULL DEFAULT '{}'
);

CREATE TABLE infobox (
    uuid      uuid NOT NULL,
    info      text NOT NULL,
    time      timestamp NOT NULL DEFAULT now(),
    read      boolean NOT NULL DEFAULT false,
    no        serial
);

ALTER TABLE userinfo ADD FOREIGN KEY ( uuid ) REFERENCES users( uuid );
ALTER TABLE hrinfo ADD FOREIGN KEY ( uuid ) REFERENCES users( uuid );
ALTER TABLE infobox ADD FOREIGN KEY ( uuid ) REFERENCES users( uuid );
ALTER TABLE hrinfo ADD FOREIGN KEY ( corpid ) REFERENCES corpinfo( corpid );
ALTER TABLE jobinfo ADD FOREIGN KEY ( corpid ) REFERENCES corpinfo( corpid );
