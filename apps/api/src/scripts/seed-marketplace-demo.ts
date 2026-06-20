import { AuthenticationInput, ExecArgs, IAuthModuleService } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createSellerAccountWorkflow } from "@mercurjs/core/workflows"

const DEMO_SELLERS = [
  { name: "Bangkok Archive", email: "seller1@example.com", currency_code: "thb" },
  { name: "Siam Streetwear", email: "seller2@example.com", currency_code: "thb" },
  { name: "Vintage Alley", email: "seller3@example.com", currency_code: "thb" },
]

const DEMO_PASSWORD = "somepassword"

function demoAuthInput(email: string): AuthenticationInput {
  return {
    url: "",
    headers: {},
    query: {},
    protocol: "http",
    body: {
      email,
      password: DEMO_PASSWORD,
    },
  }
}

export default async function seedMarketplaceDemo({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const authModule: IAuthModuleService = container.resolve(Modules.AUTH)

  logger.info("Seeding marketplace demo sellers...")

  for (const demo of DEMO_SELLERS) {
    const { data: existingMembers } = await query.graph({
      entity: "member",
      fields: ["id", "email"],
      filters: { email: demo.email },
    })

    if (existingMembers?.length) {
      const updateResult = await authModule.updateProvider("emailpass", {
        entity_id: demo.email,
        password: DEMO_PASSWORD,
      })

      if (!updateResult.success) {
        throw new Error(`Failed to refresh demo seller password for ${demo.email}: ${updateResult.error}`)
      }

      logger.info(`Seller member already exists for ${demo.email}; refreshed emailpass password hash.`)
      continue
    }

    const registerResult = await authModule.register("emailpass", demoAuthInput(demo.email))

    if (!registerResult.success || !registerResult.authIdentity?.id) {
      throw new Error(`Failed to create demo seller auth identity for ${demo.email}: ${registerResult.error}`)
    }

    await createSellerAccountWorkflow(container).run({
      input: {
        auth_identity_id: registerResult.authIdentity.id,
        member_email: demo.email,
        seller: {
          name: demo.name,
          email: demo.email,
          currency_code: demo.currency_code,
        },
      },
    })

    logger.info(`Created demo seller ${demo.name} (${demo.email})`)
  }

  logger.info("Finished seeding marketplace demo sellers.")
}
