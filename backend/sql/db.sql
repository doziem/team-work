-- create comments table
CREATE TABLE comments(
comment_id SERIAL NOT NULL PRIMARY KEY,
 article_id SERIAL NOT NULL REFERENCES articles(article_id), 
 createdon TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
 comment TEXT NOT NULL
 );

--  CREATE ARTICLE TABLE
 CREATE TABLE articles(
article_id SERIAL NOT NULL PRIMARY KEY,
 createdon TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
title VARCHAR(100) NOT NULL,
article TEXT NOT NULL
 );

 CREATE TABLE gifs(
     gif_id SERIAL NOT NULL PRIMARY KEY,
     createdon TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
     title VARCHAR(100) NOT NULL,
     cloudinary_id TEXT NOT NULL,
     imageUrl TEXT NOT NULL
 );