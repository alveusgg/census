-- Custom SQL migration file, put you code below! --
CREATE PUBLICATION alltables FOR ALL TABLES;
ALTER USER current_user WITH REPLICATION;