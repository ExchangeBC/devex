/*
    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

package specs.traits

/**
 * Methods to manage user credentials.
 */
trait Users {
  Map env = System.getenv()
  Map getAdminUser() {
    [username:env['DEV_ADMIN_USERNAME'], password:env['DEV_ADMIN_PWD']]
  }

  Map getLocalUser() {
    [username:env['DEV_USER_USERNAME'], password:env['DEV_USER_PWD']]
  }

  Map getDevUser() {
    [username:env['DEV_DEV_USERNAME'], password:env['DEV_DEV_PWD']]
  }

  Map getDev2User() {
    [username:env['DEV_DEV2_USERNAME'], password:env['DEV_DEV2_PWD']]
  }

  Map getGovUser() {
    [username:env['DEV_GOV_USERNAME'], password:env['DEV_GOV_PWD']]
  } 
}
