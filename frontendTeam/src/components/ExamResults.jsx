import PropTypes from 'prop-types';

const ExamResults = ({ examResults = [], onBack }) => {
  return (
    <div>
      <div>
      <button onClick={onBack} className="back-button" style={{ display: "block", marginLeft: "auto" }}>
        ⬅ 돌아가기
      </button>
        <h3 className='title-bar'>📊 학생 시험 결과</h3>
        <table>
          <thead>
            <tr>
              <th>학생 이름</th>
              <th>제출 시간</th>
              <th>점수</th>
            </tr>
          </thead>
          <tbody>
            {examResults.length > 0 ? (
              examResults.map((result) => (
                <tr key={result.studentId}>
                  <td>{result.name}</td>
                  <td>{result.submittedAt?.replace('T', ' ') || '-'}</td>
                  <td>{result.score ?? '미응시'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3">📌 응시한 학생이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

ExamResults.propTypes = {
  examResults: PropTypes.arrayOf(
    PropTypes.shape({
      studentId: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      submittedAt: PropTypes.string,
      examTitle: PropTypes.string, // 사용하지 않더라도 포함할 수 있음.
      score: PropTypes.number,
    })
  ).isRequired,
  onBack: PropTypes.func.isRequired,
};

export default ExamResults;
