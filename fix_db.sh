#!/bin/bash
docker exec -i garage_postgres psql -U garage_admin -d garage_master -c "SELECT conname FROM pg_constraint WHERE conrelid = 'Employee'::regclass;"
