/**
 * @apiDefine CommonListSuccess 通用的成功返回字段
 * @apiSuccess {number} code 状态码, 成功的时候固定为`0`
 * @apiSuccess {string} message 提示信息
 * @apiSuccess {object} data 数据
 * @apiSuccess {number} data.page 页码
 * @apiSuccess {number} data.size 每页数量
 * @apiSuccess {number} data.total 总数
 * @apiSuccess {any} [data.cursor] 游标
 * @apiSuccess {object[]} data.list 数据列表
 */

/**
 * @apiDefine CommonEmptySuccessResponse 通用的空返回
 * @apiSuccessExample {json} Success-Response:
 * {
 *   "code": 0,
 *   "message": "SUCCESS",
 *   "data": {
 *     "page": 1,
 *     "size": 10,
 *     "total": 100,
 *     "list": [],
 *   }
 * }
 */

 /**
  * @apiDefine UnknownError
  * @apiError {Number} code 未知错误码.
  * @apiError {String} message 错误码描述详情.
  *
  * @apiErrorExample {json} Unknown-Error:
  * {
  *   "code": "500",
  *   "message": "Unknown error"
  * }
  *
*/
