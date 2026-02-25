INSERT INTO users (id, email, display_name)
VALUES ('usr_demo', 'demo@utopia.local', 'Demo User');

INSERT INTO workspaces (id, name, owner_user_id)
VALUES ('wsp_demo', 'Demo Workspace', 'usr_demo');

INSERT INTO boards (id, workspace_id, name, description)
VALUES ('brd_demo', 'wsp_demo', 'Getting Started', 'Sample board for local development');

INSERT INTO columns (id, board_id, name, position)
VALUES
  ('col_demo_backlog', 'brd_demo', 'Backlog', 1000),
  ('col_demo_doing', 'brd_demo', 'Doing', 2000),
  ('col_demo_done', 'brd_demo', 'Done', 3000);

INSERT INTO cards (id, board_id, column_id, title, description, card_type, external_id, position, metadata_json)
VALUES
  ('crd_demo_1', 'brd_demo', 'col_demo_backlog', 'Import legacy fleet data', 'Run migrate_utopia_data.', 'task', 'demo-1', 1000, '{"priority":"high"}'),
  ('crd_demo_2', 'brd_demo', 'col_demo_doing', 'Refactor repository layer', 'Adopt repositories for all reads/writes.', 'task', 'demo-2', 1000, '{"priority":"medium"}');
