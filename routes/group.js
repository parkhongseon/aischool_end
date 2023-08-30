const express = require("express");
const router = express.Router();

const conn = require("../config/database");
const session = require("express-session");

router.post("/canvan", (req, res) => {
  let { todo, deadline, member, group_idx } = req.body;

  console.log(req.body);
  let user_id = req.session.user.user_id;
  let sql =
    "INSERT INTO tb_canvan (user_id, todo,in_process,party_idx,deadline, member) VALUES(?, ?,'0',?,?,?)";
  conn.query(sql, [user_id, todo, group_idx, deadline, member], (err, rows) => {
    if (err) {
      console.error("Error inserting data:", err);
      res.status(500).json({ message: "Database error" });
    } else {
      res.redirect("/group?data=" + group_idx);
    }
  });
});

router.post("/notice", (req, res) => {
  let { title, group_idx } = req.body;
  let user_id = req.session.user.user_id;
  let sql =
    "INSERT INTO tb_notification (noti_content, created_at, user_id,party_idx) VALUES(?, NOW(),?, ?);";
  conn.query(sql, [title, user_id, group_idx], (err, rows) => {
    if (err) {
      console.error("Error inserting data:", err);
      res.status(500).json({ message: "Database error" });
    } else {
      res.redirect("/group?data=" + group_idx);
    }
  });
});

router.get('/', (req, res) => {
  let data = req.query.data;
  let user_id = req.session.user.user_id;

  let sql_group_info = `SELECT A.user_id, B.party_title, B.user_id, B.party_idx
                        FROM tb_join A INNER JOIN tb_party B
                        ON A.party_idx = B.party_idx
                        WHERE A.user_id = ? AND B.party_idx = ?;`;

  conn.query(sql_group_info, [user_id, data], (err, rows_group_info) => {
    if (err) {
      console.error('Error retrieving data:', err);
      res.status(500).json({ message: 'Database error' });
    } else if (rows_group_info.length === 0) {
      res.status(404).json({ message: 'No matching party found' });
    } else {
      let party_idx = rows_group_info[0].party_idx;

      let sql_notice = `SELECT noti_content, created_at, user_id, party_idx FROM tb_notification WHERE party_idx = ?;`;
      let sql_todo = `SELECT todo, member, DATE_FORMAT(deadline, '%m / %d') AS formattedDeadline, in_process, process_idx, party_idx FROM tb_canvan WHERE party_idx = ?;`;

      conn.query(sql_notice, [party_idx], (err, rows_notice) => {
        if (err) {
          console.error('Error retrieving data:', err);
          res.status(500).json({ message: 'Database error' });
        } else {
          conn.query(sql_todo, [party_idx], (err, rows_todo) => {
            if (err) {
              console.error('Error retrieving data:', err);
              res.status(500).json({ message: 'Database error' });
            } else {
              // 공지사항 목록과 그룹 데이터를 렌더링하는 group   이지에 데이터 전달
              res.render('screen/group', { obj: req.session.user, notice: rows_notice, to: rows_todo, group_info: rows_group_info, group: data });
            }
          });
        }
      });
    }
  });
});





router.post("/update/:id", (req, res) => {
  const process_idx = parseInt(req.params.id);
  const { in_process } = req.body;
  console.log(req.body);
  const sql = "UPDATE tb_canvan SET in_process = ? WHERE process_idx = ?";
  conn.query(sql, [in_process, process_idx], (error, result) => {
    if (error) {
      console.error("Database error:", error);
      res.status(500).json({ message: "Database error" });
    } else if (result.affectedRows === 0) {
      res.status(404).json({ message: "Item not found" });
    } else {
      res.json({ message: "Item updated successfully" });
    }
  });
});

router.delete("/delete/:id", function (req, res) {
  const id = parseInt(req.params.id);

  // MySQL 데이터베이스에서 해당 ID의 항목 삭제
  const deleteQuery = "DELETE FROM tb_canvan WHERE process_idx = ?"; //process_idx -> task_id로 수정

  conn.query(deleteQuery, [id], (error, result) => {
    if (error) {
      console.error("Database error:", error);
      res.status(500).json({ message: "Database error" });
    } else if (result.affectedRows === 0) {
      res.status(404).json({ message: "Item not found" });
    } else {
      res.json({ message: "Item deleted successfully" });
    }
  });
});

module.exports = router;